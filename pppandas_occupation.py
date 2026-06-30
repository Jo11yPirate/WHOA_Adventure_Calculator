"""Setting up the environment for the pandas exercises"""
import pandas as pd

"""Loading the data"""
users = pd.read_csv('https://raw.githubusercontent.com/justmarkham/DAT8/master/data/u.user', sep='|', index_col='user_id') #loads the u.user dataset into a pandas dataframe called users, sets the user_id column as the index of the dataframe

"""Exploring the data"""
#print(users.head(25)) #shows first 25 rows of the dataset
#print(users.tail(10)) #shows last 10 rows of the dataset
#print(users.shape[0]) #943 observations, [0]=rows -> b/c zero indexed to 'skip' the header row
#print(users.shape[1]) #5 columns, [1]=columns
#print(users.columns) #prints the column names in the users dataframe
#print(users.index) #prints the index range of the dataset from the header row[0] to the last row[943] for the users dataframe, organized by the user_id column which is set as the index of the dataframe
#print(users.dtypes) #prints the data types of each column in the users dataframe
#print(users['occupation']) #prints the occupation column of the users dataframe

"""How many different occupations are in this dataset?"""
print("") #blank line between exercise solutionsfor readability
qty_diff_occupations = users['occupation'].nunique() #counts the number of unique values in the occupation column of the users dataframe
print(f"The number of different occupations in this dataset is: {qty_diff_occupations}.") #prints the number of unique values in the occupation column of the users dataframe

"""What is the most frequent occupation?"""
print("") #blank line between exercise solutionsfor readability
most_frequent_occupation = users['occupation'].mode()[0] #finds the most frequent value in the occupation column of the users dataframe
print(f"The most frequent occupation in this dataset is: {most_frequent_occupation}.") #prints the most frequent value in the occupation column of the users dataframe

"""Summarize the dataframe."""
print("") #blank line between exercise solutionsfor readability
users_summary = users.describe(include='all') #summarizes the users dataframe, including all columns, and returns a new dataframe called users_summary
print("The summary of the users dataframe is:") #prints a message indicating that the summary of the users dataframe will be displayed
print(users_summary) #prints the users_summary dataframe, which contains returns only the numeric columns of the users dataframe

"""Summarize all the columns in the dataframe."""
print("") #blank line between exercise solutionsfor readability
users_summary_all = users.describe(include='all') #summarizes the users dataframe, including all columns, and returns a new dataframe called users_summary_all
print("The summary of all the columns in the users dataframe is:") #prints a message indicating that the summary of all the columns in the users dataframe will be displayed
print(users_summary_all) #prints the users_summary_all dataframe, which contains returns all the columns 

"""Summarize only the occupation column."""
print("") #blank line between exercise solutionsfor readability
users_summary_occupation = users['occupation'].describe() #summarizes the occupation column of the users dataframe and returns a new dataframe called users_summary_occupation
print("The summary of the occupation column in the users dataframe is:") #prints a message indicating that the summary of the occupation column in the users dataframe will be displayed
print(users_summary_occupation) #prints the users_summary_occupation dataframe, which contains returns only the occupation column of the users dataframe

"""What is the mean age of users."""
print("") #blank line between exercise solutionsfor readability
mean_age_of_users = users['age'].mean() #calculates the mean of the age column of the users dataframe
print(f"The mean age of users in this dataset is: {mean_age_of_users}.") #prints the mean of the age column of the users dataframe

"""What is the age with the least occurrence?"""
print("") #blank line between exercise solutionsfor readability
least_frequent_age = users['age'].value_counts().idxmin() #finds the age with the least occurance in the age column of the users dataframe
print(f"The age with the least occurance in this dataset is: {least_frequent_age}.") #prints the age with the least occurance in the age column of the users dataframe

#===========
print("") #blank line between last output and command line prompt for readability