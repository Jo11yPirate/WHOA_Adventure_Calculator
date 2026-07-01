"""Setting up the environment for pandas exercises"""
import pandas as pd
import numpy as np

"""Loading the data"""
chipotle_data = pd.read_csv('https://raw.githubusercontent.com/justmarkham/DAT8/master/data/chipotle.tsv', sep='\t')

"""Exploring the data"""
#print(chipotle_data.head(10)) #shows first 10 rows of the dataset
#print(chipotle_data.shape[0]) #4622 observations, [0]=rows -> b/c zero indexed to 'skip' the header row
#print(chipotle_data.shape[1]) #5 columns, [1]=columns
#print(chipotle_data.columns)  #['order_id', 'quantity', 'item_name', 'choice_description', 'item_price'], displays the column names in the chipotle_data dataframe
#print(chipotle_data.index)  #RangeIndex(start=0, stop=4622, step=1), displays the index range of the dataset from the header row[0] to the last row[4621] for the chipotle_data dataframe

"""Which was the most ordered item?"""  
most_ordered_item = chipotle_data.groupby('item_name').sum().sort_values('quantity', ascending=False) #Chicken Bowl, sorts quantity column of the chipotle_data dataframe in descending order and returns the first row of the item_name column
print("") #blank line for readability
print(f"The most ordered item is: {most_ordered_item.index[0]}.") #prints the first row of the item_name column in the most_ordered_item dataframe

"""What is the quantity of the most_ordered_item?"""
qty_of_most_ordered_item = most_ordered_item['quantity'].iloc[0] #761, checks the first row of the quantity column in the most_ordered_item dataframe
print("") #blank line for readability
print(f"The quantity of the most ordered item is: {qty_of_most_ordered_item}.") #prints the first row of the quantity column in the most_ordered_item dataframe

"""What was the most ordered item in the choice_description column?"""
qty_of_most_ordered_choice_description = chipotle_data.groupby('choice_description').sum().sort_values('quantity', ascending=False).head(1) #Diet Coke, sorts quantity column of the chipotle_data dataframe in descending order and returns the first row of the choice_description column
print("") #blank line for readability
print(f"The most ordered item in the choice_description column is: {qty_of_most_ordered_choice_description.index[0]}.") #prints the first row of the choice_description column in the qty_of_most_ordered_choice_description dataframe

"""How many items were ordered in total?"""
total_items_ordered = chipotle_data['quantity'].sum() #4972, takes the sum of the quantity column in the chipotle_data dataframe
print("") #blank line for readability
print(f"The total number of items ordered is: {total_items_ordered}.") #prints the sum of the quantity column in the chipotle_data dataframe

"""Convert the item_price column into float values"""
#print(chipotle_data['item_price'].dtype) #str
chipotle_data['item_price'] = chipotle_data['item_price'].str.replace('$', '').astype(float) 
#print(chipotle_data['item_price'].dtype) #float64

"""What was the total revenue for the period in the dataset?"""
fulfilled_orders = chipotle_data[chipotle_data['quantity'] > 0] #fulfilled orders only, filtered by values greater than zero in the quantity column of the chipotle_data dataframe
total_revenue_for_period = (fulfilled_orders['quantity'] * fulfilled_orders['item_price']).sum() #39237.02
print("") #blank line for readability
print("The total revenue for the period represented in the dataset is: $" + str(round(total_revenue_for_period, 2)) + ".") #prints the sum of the product of the quantity and item_price columns in the fulfilled_orders dataframe, rounded to 2 decimal places

"""What was the average revenue per order?"""
average_revenue_per_order = total_revenue_for_period / fulfilled_orders['order_id'].nunique() #39237.02 / 1834 = 21.39, takes the total revenue for the period and divides it by the number of unique order_id values in the fulfilled_orders dataframe
print("") #blank line for readability
print("The average revenue per order is: $" + str(round(average_revenue_per_order, 2)) + ".") #prints the total revenue for the period divided by the number of unique order_id values in the fulfilled_orders dataframe, rounded to 2 decimal places

"""How many different items are sold?"""
qty_of_different_items_sold = chipotle_data['item_name'].nunique() #50, counts the number of unique values in the item_name column of the chipotle_data dataframe
print("") #blank line for readability
print(f"The number of different items sold is: {qty_of_different_items_sold}.") #prints the number of unique values in the item_name column of the chipotle_data dataframe

"""How many unique orders were there?"""
unique_orders = chipotle_data['order_id'].nunique() #1834, counts the number of unique values in the order_id column of the chipotle_data dataframe
print("") #blank line for readability
print(f"The number of unique orders is: {unique_orders}.") #prints the number of unique values in the order_id column of the chipotle_data dataframe

print("") #blank line between last output and command line

"""This feels a little too easy with AI helping fill in the blanks. I'm not sure if that's true or if I'm just understanding the process better than I think."""
