# Creates ./user-card/ with the four files of a component; the stylesheet has the format of xaendar.json
xd generate component user-card
xd g c user-card

# In another folder
xd g c user-card --path src/app/users

# Replaces the folder if it exists already
xd g c user-card --force
