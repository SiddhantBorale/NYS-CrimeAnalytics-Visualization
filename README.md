Instructions to run the program

You must have node modules installed.

Step 1:
npm install 
npm install express


Step 2:
How to Create analysis json files for the graphs:

    python3 public/analysis/barchart.py
    python3 public/analysis/mds-attr-analysis.py
    python3 public/analysis/parallel-analysis.py
    python3 public/analysis/areachart.py
Step 3:
once you have all the prelimanaries, you can start the localhost server by using:

    node server/server.js 

    Use npm install if it does not work

Step 4:
finally, go to  http://localhost:3000 

References: 
1) I used graphs from Lab 2 and 3 and edited it to fit the goals of this assignment
2) I used style.css from Lab 2 and 3 and extended it to fit the goals of this assignment
