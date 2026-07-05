"""Setting up the practice environment for pandas exercises"""
import pandas as pd

"""Loading the data"""
euro12_data = pd.read_csv('https://raw.githubusercontent.com/guipsamora/pandas_exercises/master/02_Filtering_%26_Sorting/Euro12/Euro_2012_stats_TEAM.csv')

"""Exploring the data"""
print("") # blank line for readability
#print(euro12_data.info()) #16 rows x 35 columns
#print(euro12_data.columns)
"""Index(['Team', 'Goals', 'Shots on target', 'Shots off target',
       'Shooting Accuracy', '% Goals-to-shots', 'Total shots (inc. Blocked)',
       'Hit Woodwork', 'Penalty goals', 'Penalties not scored', 'Headed goals',
       'Passes', 'Passes completed', 'Passing Accuracy', 'Touches', 'Crosses',
       'Dribbles', 'Corners Taken', 'Tackles', 'Clearances', 'Interceptions',
       'Clearances off line', 'Clean Sheets', 'Blocks', 'Goals conceded',
       'Saves made', 'Saves-to-shots ratio', 'Fouls Won', 'Fouls Conceded',
       'Offsides', 'Yellow Cards', 'Red Cards', 'Subs on', 'Subs off',
       'Players Used'], dtype='str)
"""

"""Select only the Goal column"""
euro12_goals = euro12_data[['Goals']] 
#print(euro12_goals)

"""How many teams participated in Euro 2012?"""
#print("Number of teams participated in Euro 2012:", euro12_data['Team'].nunique()) # 16

"""What is the number of columns in the dataset?"""
#print("Number of columns in the dataset:", len(euro12_data.columns)) # 25

"""Assign the Team, Yellow Cards and Red Cards columns to a new dataframe called discipline."""
discipline = euro12_data[['Team', 'Yellow Cards', 'Red Cards']]
#print(discipline)

"""Sort the teams by Red Cards, then to Yellow Cards"""
sorted_discipline = discipline.sort_values(['Red Cards', 'Yellow Cards'], ascending=[False, False])
#print(sorted_discipline)

"""Calculate the mean Yellow Cards given per Team and return the result as an integer (no decimal places)"""
#print("Mean Yellow Cards given per Team:", discipline['Yellow Cards'].mean().astype(int)) # 7

"""Filter the teams that scored more than 6 goals"""
high_scoring_teams = euro12_data[euro12_data['Goals'] > 6] # Germany, Spain
#print(high_scoring_teams)

"""Select the teams that start with G"""
g_teams = euro12_data[euro12_data['Team'].str.startswith('G')] # Germany, Greece
#print(g_teams)

"""Select the first 7 columns"""
first_7_columns = euro12_data.iloc[:, :7]
#print(first_7_columns)

"""Select all columns except the last 3"""
all_except_last_3 = euro12_data.iloc[:, :-3]
#print(all_except_last_3)

"""Present only the Shooting Accuracy from England, Italy and Russia"""
shooting_accuracy = euro12_data.loc[euro12_data['Team'].isin(['England', 'Italy', 'Russia']), ['Team', 'Shooting Accuracy']]
print(shooting_accuracy)

# ===========
print("") # blank line for readability