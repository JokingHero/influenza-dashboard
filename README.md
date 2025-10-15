# React + TypeScript + Vite

# First command was:
npm create vite@latest . -- --template react-ts

# Notes
lack of "}", line 91 for variant-tracker/emergVar_recentVariants_mocked.json
extra "," line 12 for variant-tracker/countryCount_h3n2.json

I fixed the two above and now files are valid json.

For some reason there is no difference between 
variant-tracker/weekRegion2perc_h1n1.json and variant-tracker/weekRegion2perc_h3n2.json
variant-tracker/countryCountTotal_h1n1.json and variant-tracker/weekRegion2perc_h3n2.json

Other files have differences.

# run the app
npm run dev