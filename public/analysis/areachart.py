import pandas as pd
import json

data = pd.read_csv('public/data/data.csv')

num_columns = [
    'Employed', 'Unemployed', 'Crime Index Total', 'Violent Total',
    'Property Total', 'Burglary', 'Larceny', 'Motor Vehicle Theft'
]

grouped_data = data.groupby(['Year', 'County'])[num_columns].sum().reset_index()

analysis_results = {}

years = sorted(data['Year'].unique())
for year in years:
    year_data = grouped_data[grouped_data['Year'] == year]
    normalized_data = year_data.copy()
    for column in num_columns:
        min_val = year_data[column].min()
        max_val = year_data[column].max()
        normalized_data[column] = (year_data[column] - min_val) / (max_val - min_val)
    analysis_results[str(year)] = normalized_data.to_dict(orient='records')

total_data = grouped_data.groupby('County')[num_columns].sum().reset_index()
normalized_total_data = total_data.copy()
for column in num_columns:
    min_val = total_data[column].min()
    max_val = total_data[column].max()
    normalized_total_data[column] = (total_data[column] - min_val) / (max_val - min_val)

analysis_results['All Years'] = normalized_total_data.to_dict(orient='records')

with open('public/data/areachart_analysis.json', 'w') as f:
    json.dump(analysis_results, f, indent=4)

print("Results saved to areachart_analysis.json")
