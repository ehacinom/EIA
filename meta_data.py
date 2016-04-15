#!/usr/local/bin/python

import os
import json
from collections import defaultdict

def datafiles(filename="./data/datafiles.json", directory="data"):
    """
    
    Saves to filename the names of the files in /data, created by
    get_data.py. Sorted by frequency "A", "Q", "M" (annual/quarter/month).
    
    Note: sometimes Mac creates .DS_Store and it doesn't expect it.
    I fixed with a defaultdict call, but it's annoying that .DS_Store is 
    there.
    
    """
    
    files = defaultdict(list)
    for d in os.listdir(directory):
        files[d[0]].append(d)
    
    with open(filename, 'wb') as f:
        json.dump(files, f)
    


    