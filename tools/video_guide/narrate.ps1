param([string]$OutputDirectory, [string]$Language = 'en', [int]$Limit = 0)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$plan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'storyboard.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$null = New-Item -ItemType Directory -Path $OutputDirectory -Force
Add-Type -ReferencedAssemblies System.Speech -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Speech.Synthesis;
using System.Speech.AudioFormat;
public class VideoWord { public double seconds; public string text; public int start; public int length; }
public class VideoNarrator {
 public static VideoWord[] Render(string voice, string text, string path) {
  var words = new List<VideoWord>();
  using (var s = new SpeechSynthesizer()) {
   s.SelectVoice(voice); s.Rate=1; s.Volume=100;
   s.SpeakProgress += (sender,e) => words.Add(new VideoWord {seconds=e.AudioPosition.TotalSeconds,text=e.Text,start=e.CharacterPosition,length=e.CharacterCount});
   s.SetOutputToWaveFile(path,new SpeechAudioFormatInfo(16000,AudioBitsPerSample.Sixteen,AudioChannel.Mono));
   s.Speak(text); s.SetOutputToNull();
  }
  return words.ToArray();
 }
}
'@
$count = 0
try {
  foreach ($chapter in $plan.chapters) {
    foreach ($scene in $chapter.steps) {
      $dest = Join-Path $OutputDirectory ($scene.id + '.wav')
        if ($Language -eq 'es') {
          $spoken = $scene.textES
          if (-not $spoken) { throw ('Spanish narration missing: ' + $scene.id) }
          $name = 'Microsoft Helena Desktop'
        } else { $spoken = $scene.text; $name = $plan.voice }
        $spoken = $spoken -creplace 'SU\((\d+)\)', 'S U $1' -creplace '\bGHU\b','G H U' -creplace '\bCMS\b','C M S' -creplace '\bKK\b','Kaluza Klein'
        if ($Language -eq 'en') {
          $spoken = $spoken -creplace '\bGeV\b','giga electron volts' -creplace '\bTeV\b','tera electron volts' -creplace '\u0394','delta ' -creplace '\u03b8','theta ' -creplace '\u03b7','eta ' -creplace '\u03b1','alpha ' -creplace '\u03bc','mu ' -creplace '\u03c7','chi ' -creplace '\u00b2',' squared ' -creplace '\u00b3',' cubed ' -creplace '\u2260',' not equal to ' -creplace '\u2192',' to ' -creplace '\u2264',' less than or equal to ' -creplace '\u2265',' greater than or equal to ' -creplace '\u00d7',' times '
        }
      $reuse = $false
      if ((Test-Path -LiteralPath $dest) -and (Test-Path -LiteralPath ($dest + '.json'))) {
        $cached = Get-Content -LiteralPath ($dest + '.json') -Raw -Encoding UTF8 | ConvertFrom-Json
        $reuse = $cached.sampleRate -eq 16000 -and $cached.text -ceq $spoken -and $cached.voice -eq $name -and $cached.rate -eq 1
      }
      if (-not $reuse) {
        $words = [VideoNarrator]::Render($name, $spoken, [System.IO.Path]::GetFullPath($dest))
        @{text=$spoken;voice=$name;rate=1;sampleRate=16000;words=$words} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($dest + '.json') -Encoding UTF8
      }
      $count++
      Write-Output ('Narrated ' + $scene.id)
      if ($Limit -gt 0 -and $count -ge $Limit) { return }
    }
  }
} finally { }
