"""Setting up the environment for the pandas exercises"""
import pandas as pd
import numpy as np

"""Loading the data"""
world_food_facts = pd.read_csv('C:/Users/samha/Desktop/GITHUB/Datasets/en.openfoodfacts.org.products.tsv.', 
                               sep='\t',                            #specifies that the file is a tab-separated values file
                               index_col=0,                         #specifies that the first column of the file should be used as the index of the dataframe
                               low_memory=False                     #specifies that the file should be read in chunks to reduce memory usage
)  

"""Exploring the data"""
#print(world_food_facts.head(5))  #shows first 5 rows of the dataset
#print(world_food_facts.info())  #shows information about the dataset
#print(world_food_facts.shape[0])  #25 rows, [0]=rows -> b/c zero indexed to 'skip' the header row
#print(world_food_facts.shape[1])  #162 columns, [1]=columns
#print(world_food_facts.columns)  #prints the column names in the world_food_facts dataframe
#print(world_food_facts.columns[103])  #column at index 103 is labeled "-glucose_100g"
#print(world_food_facts.dtypes['-glucose_100g']) #column at index 103 holds float64 values
#print(world_food_facts.index)  #prints the index range of the dataset from the header row[0] to the last row[24] for the world_food_facts dataframe, organized by the first column of the dataset ("code") which is set as the index of the dataframe
#print(world_food_facts.values[18][6])  #prints the value in column 6 ("product_name") of the world_food_facts dataframe for the row at index 18, Output: "Lotus Organic Brown Jasmine Rice"
