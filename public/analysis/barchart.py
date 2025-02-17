import pandas as pd
import json

data = pd.read_csv('public/data/data.csv') # load data

num_columns = ['Employed', 'Unemployed', 'Crime Index Total', 'Violent Total',
    'Property Total', 'Burglary', 'Larceny', 'Motor Vehicle Theft'
]

grouped_data = data.groupby(['Year', 'County'])[num_columns].sum().reset_index()

analysis_results = {}
years = sorted(data['Year'].unique())

for year in years: # group by years
    year_data = grouped_data[grouped_data['Year'] == year]
    analysis_results[str(year)] = year_data.to_dict(orient='records')

total_data = grouped_data.groupby('County')[num_columns].sum().reset_index()
analysis_results['All Years'] = total_data.to_dict(orient='records') # aggregate by total data across all years

with open('public/data/barchart_analysis.json', 'w') as f:
    json.dump(analysis_results, f, indent=4)

print("Results saved to barchart_analysis.json")
