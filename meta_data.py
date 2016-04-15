#!/usr/local/bin/python

import os
import json
from collections import defaultdict

def datafiles(filename="./data/datafiles.json", directory="data"):
    """
    
    Saves to filename the names of the files in /data, created by
    get_data.py. Sorted by frequency "A", "Q", "M" (annual/quarter/month).
    
    Note: defaultdict call to deal with unexpected files, like
    - .DS_Store
    - datafiles.json :)
    
    """
    
    files = defaultdict(list)
    for d in os.listdir(directory):
        files[d[0]].append(directory+"/"+d)
    
    with open(filename, 'wb') as f:
        json.dump(files, f)
    


    