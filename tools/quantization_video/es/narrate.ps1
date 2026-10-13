param([int]$Limit = 0)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$mathVideoPlan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'storyboard.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$mathVideoAudio = Join-Path $PSScriptRoot 'audio'
$null = New-Item -ItemType Directory -Path $mathVideoAudio -Force
Add-Type -ReferencedAssemblies System.Speech -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Speech.Synthesis;
using System.Speech.AudioFormat;
public class MathWord { public double seconds; public string text; public int start; public int length; }
public class MathNarrator {
 public static MathWord[] Render(string voice, int rate, string text, string path) {
  var words = new List<MathWord>();
  using (var s = new SpeechSynthesizer()) {
   s.SelectVoice(voice); s.Rate=rate; s.Volume=100;
   s.SpeakProgress += (sender,e) => words.Add(new MathWord {seconds=e.AudioPosition.TotalSeconds,text=e.Text,start=e.CharacterPosition,length=e.CharacterCount});
   s.SetOutputToWaveFile(path,new SpeechAudioFormatInfo(16000,AudioBitsPerSample.Sixteen,AudioChannel.Mono));
   s.Speak(text); s.SetOutputToNull();
  }
  return words.ToArray();
 }
}
'@
$mathVideoCount = 0
foreach ($scene in $mathVideoPlan.scenes) {
 $dest = Join-Path $mathVideoAudio ($scene.id + '.wav')
 $reuse = $false
 if ((Test-Path -LiteralPath $dest) -and (Test-Path -LiteralPath ($dest + '.json'))) {
  $cached = Get-Content -LiteralPath ($dest + '.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  $reuse = $cached.text -ceq $scene.text -and $cached.voice -eq $mathVideoPlan.voice -and $cached.rate -eq $mathVideoPlan.rate
 }
 if (-not $reuse) {
  $words = [MathNarrator]::Render($mathVideoPlan.voice, $mathVideoPlan.rate, $scene.text, [System.IO.Path]::GetFullPath($dest))
  @{text=$scene.text;voice=$mathVideoPlan.voice;rate=$mathVideoPlan.rate;sampleRate=16000;words=$words} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($dest + '.json') -Encoding UTF8
 }
 Write-Output ('Narrated ' + $scene.id)
 $mathVideoCount++
 if ($Limit -gt 0 -and $mathVideoCount -ge $Limit) { break }
}
