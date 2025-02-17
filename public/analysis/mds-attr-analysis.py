import pandas as pd
import numpy as np
from sklearn.manifold import MDS
import json

data = pd.read_csv('public/data/data.csv')

numerical_columns = ['Employed', 'Unemployed', 'Crime Index Total', 'Violent Total',
    'Property Total', 'Burglary', 'Larceny', 'Motor Vehicle Theft'
]


matrix = data[numerical_columns]

correlation_matrix = matrix.corr()

distance_matrix = 1 - np.abs(correlation_matrix)

mds = MDS(n_components=2, dissimilarity='precomputed', random_state=42)
mds_result = mds.fit_transform(distance_matrix)

mds_data = {
    "coordinates": mds_result.tolist(),
    "columns": numerical_columns
}

with open('public/data/mds_attributes_results.json', 'w') as f:
    json.dump(mds_data, f)

print("MDS attribute analysis saved")
