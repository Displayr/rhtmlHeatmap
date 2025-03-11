{ pkgs ? import <nixpkgs> {}, displayrUtils }:

pkgs.rPackages.buildRPackage {
  name = "rhtmlHeatmap";
  version = displayrUtils.extractRVersion (builtins.readFile ./DESCRIPTION); 
  src = ./.;
  description = ''An improved heatmap package based on d3heatmap.'';
  propagatedBuildInputs = with pkgs.rPackages; [ 
    htmlwidgets
    base64enc
    png
  ];
}
