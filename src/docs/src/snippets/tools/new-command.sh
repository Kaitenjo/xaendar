# Asks the format of the stylesheets, creates ./my-app, writes the project, then runs npm install in it
xd new my-app

# Somewhere else: the project folder is created inside the given path
xd new my-app --path ../projects

# The format of the stylesheets, without asking: css, scss, sass (indented syntax) or less
xd new my-app --style scss
