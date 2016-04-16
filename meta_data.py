#!/usr/local/bin/python

import os
import json
from collections import defaultdict

def write_json(fn, dictionary):
    """
    Just as you think.
    """
    
    with open(fn, 'wb') as f:
        json.dump(dictionary, f)

def list_files(filename="./data/datafiles.json", directory="data"):
    """
    
    Saves to filename, in json format, files in a directory, sorted
    by first letter.
    
    Useful for getting assorted data files from get_data.py
    into groups sorted by frequency.
    
    Note: defaultdict call to deal with unexpected files, like
    - .DS_Store
    - datafiles.json :)
    
    """
    
    # search directory for 
    files = defaultdict(list)
    for d in os.listdir(directory):
        files[d[0]].append(directory+"/"+d)
    
    # write to filename
    write_json(filename, files)
    
    return files

def aggregate(filename="./data/datafiles.json", 
              directory="data",
              out="./data/data.json"):
    """
    
    Aggregate all the files in one file.
    
    """
    
    data = {"A":{}, "Q": {}, "M": {}}
    
    files = list_files(filename, directory)
    for freq, flist in files.iteritems():
        if freq not in data: continue
        for fn in flist:
            with open(fn, 'r') as f:
                tag = fn[5:-5]
                data[freq][tag] = json.load(f)

    # write
    write_json(out, data)
    
    