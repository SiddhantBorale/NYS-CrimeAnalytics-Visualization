import pandas as pd
import json

data = pd.read_csv('public/data/data.csv') # load data

numerical_columns = [
  'Employed', 'Unemployed', 'Crime Index Total', 'Violent Total',
    'Property Total', 'Burglary', 'Larceny', 'Motor Vehicle Theft'
]
categorical_columns = ["Region", "County", "Year"]

filtered_data = data[numerical_columns + categorical_columns]

# normalize data
normalized_data = filtered_data.copy()
for col in numerical_columns:
    min_val = normalized_data[col].min()
    max_val = normalized_data[col].max()
    normalized_data[col] = (normalized_data[col] - min_val) / (max_val - min_val)

with open('public/data/parallel_coordinates_analysis.json', 'w') as json_file:
    json.dump(normalized_data.to_dict(orient='records'), json_file, indent=4)

print("Results saved to parallel_coordinates_analysis.json.")
