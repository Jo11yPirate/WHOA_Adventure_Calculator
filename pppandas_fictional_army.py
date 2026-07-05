# Load libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Establish the raw data dictionary
raw_data = {'regiment': ['Nighthawks', 'Nighthawks', 'Nighthawks', 'Nighthawks', 'Dragoons', 'Dragoons', 'Dragoons', 'Dragoons', 'Scouts', 'Scouts', 'Scouts', 'Scouts'],
            'company': ['1st', '1st', '2nd', '2nd', '1st', '1st', '2nd', '2nd','1st', '1st', '2nd', '2nd'],
            'deaths': [523, 52, 25, 616, 43, 234, 523, 62, 62, 73, 37, 35],
            'battles': [5, 42, 2, 2, 4, 7, 8, 3, 4, 7, 8, 9],
            'size': [1045, 957, 1099, 1400, 1592, 1006, 987, 849, 973, 1005, 1099, 1523],
            'veterans': [1, 5, 62, 26, 73, 37, 949, 48, 48, 435, 63, 345],
            'readiness': [1, 2, 3, 3, 2, 1, 2, 3, 2, 1, 2, 3],
            'armored': [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1],
            'deserters': [4, 24, 31, 2, 3, 4, 24, 31, 2, 3, 2, 3],
            'origin': ['Arizona', 'California', 'Texas', 'Florida', 'Maine', 'Iowa', 'Alaska', 'Washington', 'Oregon', 'Wyoming', 'Louisana', 'Georgia']
            }

# Convert the raw data dictionary into a pandas DataFrame
fictional_army = pd.DataFrame(raw_data)

# Manage overall readability
divider = "~" * 72  # Create a divider line, output type: str

# ===========
# Explore the DataFrame
# ===========

print(divider)
print("INFO():")
print(fictional_army.info())  # Display a concise summary of the DataFrame, including the index dtype and columns, non-null values and memory usage

print(divider)
print("DESCRIBE():")
print(fictional_army.describe().round(2))  # Display a concise summary of the DataFrame's numerical columns, with statistics rounded to 2 decimal places

print(divider)
print("COLUMNS:")
print(fictional_army.columns)  # Display the column labels of the DataFrame

print(divider)
print("INDEX:")
print(fictional_army.index)  # Display the index (row labels) of the DataFrame

print(divider)
print("HEAD(5):")
print(fictional_army.head(5))  # Display the first 5 rows of the DataFrame

print(divider) 
print("SAMPLE(10):")
print(fictional_army.sample(10))  # Display a random sample of 10 rows from the DataFrame

print(divider)
print("TAIL(5):")
print(fictional_army.tail(5))  # Display the last 5 rows of the DataFrame

# ===========
# Clean the DataFrame
# ===========

#num_nulls = fictional_army.isnull().sum()  # 0 Null values in the DataFrame, output type: Series

#num_duplicates = fictional_army.duplicated().sum()  # 0 Duplicate rows in the DataFrame, output type: int

# ===========
# Analyze the DataFrame
# ===========

print(divider)
print("NUNIQUE():")
num_unique = fictional_army.nunique()  # Count the number of unique values in each column, output type: Series
print(num_unique)

print(divider)
print("CORRELATION():")
print(fictional_army.corr(numeric_only=True).round(2))  # Compute pairwise correlation of columns, excluding NA/null values, output type: DataFrame

# ===========
# Visualize the DataFrame to detect anomalies and patterns
# ===========

fictional_army.groupby('regiment')['deaths'].sum().plot(kind='bar', title='Total Deaths by Regiment')  # Create a bar plot of total deaths by regiment
plt.show()  # Display the plot

# ==========
# Ask questions about the DataFrame
# ==========

"""
1) Why do Scouts have significantly fewer deaths than the other regiments?
2)
"""

# ==========
# Work through guipsamora exercises
# ==========
