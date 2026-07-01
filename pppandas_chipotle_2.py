"""Setting up the environment for pandas exercises"""
import pandas as pd

"""Loading the data"""
chipotle_2_data = pd.read_csv('https://raw.githubusercontent.com/justmarkham/DAT8/master/data/chipotle.tsv', sep='\t')

"""Exploring the data"""
print("") # blank line for readability
#print(chipotle_2_data.head(10)) # shows first 10 rows of the dataset
#print(chipotle_2_data.columns) # RangeIndex, order_id, quantity, item_name, choice_description, item_price

"""How many products cost more than $10.00?"""
#item_price / qty = price of individual item, then filter for items greater than $10.00, then count the number of unique items
chipotle_2_data['individual_item_price'] = chipotle_2_data['item_price'].str.replace('$', '').astype(float) / chipotle_2_data['quantity'] # creates a new column for the individual item price by removing the dollar sign, converting to float, and dividing by quantity
#print(chipotle_2_data.head()) # shows first 10 rows of the dataset with the new column
filtered_chipotle_2_data = chipotle_2_data.drop_duplicates(subset=['item_name', 'choice_description']) # drops duplicate rows based on the item_name and choice_description columns, keeping only the first occurrence of each unique combination
filtered_chipotle_2_data = filtered_chipotle_2_data[filtered_chipotle_2_data['individual_item_price'] > 10.00] # filters the dataframe for items that cost more than $10.00

"""What is the price of each item?"""
#print(filtered_chipotle_2_data[['item_name', 'choice_description', 'individual_item_price']].sort_values('individual_item_price', ascending=False)) # prints the item_name, choice_description, and individual_item_price columns of the filtered dataframe, sorted by individual_item_price in descending order

"""Sort by the name of the item."""
filtered_chipotle_2_data = chipotle_2_data.sort_values('item_name') # sorts the filtered dataframe by the item_name column in ascending order
#print(filtered_chipotle_2_data.info()) # prints the summary information of the filtered dataframe, including the number of non-null values and data types of each column

"""What was the quantity of the most expensive item ordered?"""
#For whatever reason, I couldn't wrap my head around this one at all.

"""How many times was a Veggie Salad Bowl ordered?"""
#print(chipotle_2_data[chipotle_2_data['item_name'] == 'Veggie Salad Bowl']['quantity'].sum()) # sums the quantity of all orders for the Veggie Salad Bowl by filtering the dataframe for rows where the item_name is 'Veggie Salad Bowl' and summing the quantity column

"""How many times did someone order more than one Canned Soda?"""
print(chipotle_2_data[(chipotle_2_data['item_name'] == 'Canned Soda') & (chipotle_2_data['quantity'] > 1)].shape[0]) # counts the number of rows in the dataframe where the item_name is 'Canned Soda' and the quantity is greater than 1 by filtering the dataframe for those conditions and using the shape attribute to get the number of rows

# ===========
print("") # blank line for readability