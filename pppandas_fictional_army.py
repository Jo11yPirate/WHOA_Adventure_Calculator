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
#print(fictional_army.columns)  # Display the column labels of the DataFrame
for column, label in enumerate(fictional_army, start=1): # Displays as a numbered list for better readability
	print(f'{column}. {label}')

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

#fictional_army.groupby('regiment')['deaths'].sum().plot(kind='bar', title='Total Deaths by Regiment')  # Create a bar plot of total deaths by regiment
#plt.show()  # Display the plot

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

fictional_army.set_index('origin', inplace=True)  # Set the 'origin' column as the index of the DataFrame

print(divider)
print("VETERANS COLUMN:")
print(fictional_army['veterans'].head(5))  # Display the first 5 rows of the 'veterans' column

print(divider)
print("VETERANS & DEATHS COLUMNS:")
print(fictional_army[['veterans', 'deaths']].head(5))  # Display the first 5 rows of the 'veterans' and 'deaths' columns

print(divider)
print("VETERANS, SIZE, & DESERTERS FROM MAINE & ALASKA:")
print(fictional_army.loc[['Maine', 'Alaska'], ['veterans', 'size', 'deserters']])  # Display the 'veterans', 'size', and 'deserters' columns for the rows with index labels 'Maine' and 'Alaska'

print(divider)
print("ROWS 3 TO 7, COLUMNS 3 TO 6:")
print(fictional_army.iloc[2:8, 2:7])  # Display the rows from index 3 to 7 and columns from index 3 to 6 of the DataFrame

print(divider)
print("ALL ROWS AFTER FOURTH ROW:")
print(fictional_army.iloc[4:])  # Display all rows after the fourth row of the DataFrame

print(divider)
print("ALL ROWS BEFORE FOURTH ROW:")
print(fictional_army.iloc[:4])  # Display all rows before the fourth row of the DataFrame

print(divider)
print("THIRD THRU SEVENTH COLUMNS:")
print(fictional_army.iloc[:, 2:7])  # Display the third through seventh columns of the DataFrame

print(divider)
print("ROWS WHERE DEATHS > 50:")
print(fictional_army[fictional_army['deaths'] > 50])  # Display rows where the 'deaths' column has values greater than 50

print(divider)
print("ROWS WHERE DEATHS > 500 OR < 50:")
print(fictional_army[(fictional_army["deaths"] > 500) | (fictional_army["deaths"] < 50)]) # Display rows where the 'death's column has values greater than 500 or less than 50

print(divider)
print("ALL REGIMENTS NOT NAMED 'DRAGOONS':")
print(fictional_army[fictional_army['regiment'] != 'Dragoons']) # Display all regiments besides the one named 'Dragoons'

print(divider)
print("ROWS LABELED 'Texas' AND 'Arizona':")
print(fictional_army.loc[['Texas', 'Arizona'], :]) # Display all columns of the rows labeled 'Texas' and 'Arizona'

print(divider)
print("THIRD CELL IN THE ROW LABELED 'Arizona':")
print(fictional_army.loc[['Arizona']].iloc[:, 2])

print(divider)
print("THIRD CELL IN COLUMN LABELED 'Deaths':")
print(fictional_army.loc[:, ['deaths']].iloc[2])