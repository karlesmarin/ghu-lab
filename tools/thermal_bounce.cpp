// SPDX-License-Identifier: GPL-3.0-or-later
// GHU adapter to PhaseTracer's one-dimensional O(3) shooting solver.
#include "phase_finder.hpp"
#include "action_calculator.hpp"
#include <fstream>
#include <iomanip>
class GHUPotential : public EffectivePotential::Potential {
public:
  double invR,g,temp; std::vector<double> c1,c2;
  explicit GHUPotential(const char* path){std::ifstream f(path);int n;f>>invR>>g>>temp>>n;
    if(!f||n<1||n>1200)throw std::runtime_error("Invalid coefficient file");
    for(int i=0;i<n;i++){double a,b;f>>a>>b;c1.push_back(a);c2.push_back(b);}if(!f)throw std::runtime_error("Truncated input");}
  size_t get_n_scalars() const override{return 1;}
  double val(double phi,int derivative) const {
    const double a=g*phi/invR,C=3*std::pow(invR,4)/(64*std::pow(M_PI,6));double v=0;
    for(size_t i=0;i<c1.size();i++)for(int k=1;k<=2;k++){
      double w=M_PI*(i+1)*k,c=k==1?c1[i]:c2[i],angle=w*a;
      v+=c*(derivative==0?-2*std::pow(std::sin(angle/2),2):derivative==1?-w*std::sin(angle):-w*w*std::cos(angle));
    }return C*v*std::pow(g/invR,derivative);
  }
  double V(Eigen::VectorXd p,double) const override{return val(p[0],0);}
  Eigen::VectorXd dV_dx(Eigen::VectorXd p,double) const override{Eigen::VectorXd r(1);r<<val(p[0],1);return r;}
  Eigen::MatrixXd d2V_dx2(Eigen::VectorXd p,double) const override{Eigen::MatrixXd r(1,1);r<<val(p[0],2);return r;}
};
int main(int argc,char** argv){try{
  if(argc<4)throw std::runtime_error("thermal_bounce coefficients alpha_true tolerance [profile.csv]");
  GHUPotential p(argv[1]);PhaseTracer::ActionCalculator ac(p);
  double tolerance=std::stod(argv[3]);ac.set_PD_xtol(tolerance);ac.set_PD_phitol(tolerance);
  Eigen::VectorXd t(1),f(1);t<<std::stod(argv[2])*p.invR/p.g;f<<0;
  double action=ac.get_action(t,f,p.temp);if(!std::isfinite(action)||action<=0)throw std::runtime_error("Nonpositive or nonfinite action");
  std::cout<<"GHU_ACTION "<<std::setprecision(17)<<action/p.temp<<"\n";
  if(argc>4){auto profile=ac.get_bubble_profile();std::ofstream out(argv[4]);out<<"r_GeV_inverse,phi_GeV\n";
    for(size_t i=0;i<profile.R.size();i++)out<<std::setprecision(17)<<profile.R[i]<<","<<profile.Phi[i]<<"\n";}
  return 0;
}catch(const std::exception& e){std::cerr<<e.what()<<"\n";return 1;}}
