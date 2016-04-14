#!/usr/local/bin/python

import json
import urllib
from datetime import datetime
import requests
import re 
from collections import defaultdict


def load_json(url):
    """
    Input:  str url
    Output: dict json data
    """
    url = urllib.urlopen(url)
    return json.load(url)

def update_data(api_key, date_last_update, cid=0):
    """
    INPUT
    str api_key
    datetime.datetime() date_last_update
    (optional) str cid
    
    If no cid is supplied, we check all the default category_id to 
    retrieve all series_IDs we need to update.
    
    API documentation for EIA: http://www.eia.gov/opendata/commands.cfm
    
    """
    
    # default if no cid input
    category_id = {"1": "all fuels", 
                   "4": "coal", 
                   "7": "petroleum liquids", 
                   "8": "petroleum coke",
                   "9": "natural gas", 
                   "10": "other gases",
                   "11": "nuclear", 
                   "12": "conventional hydroelectric",
                   "19": "hydro-electric pumped storage",
                   "13": "other renewables (total)", 
                   "14": "wind",
                   "15": "all utility-scale solar", 
                   "1718408": "all solar",
                   "1718400": "utility-scale photovoltaic",
                   "1718409": "distributed solar", 
                   "1718401": "utility-scale thermal",
                   "17": "geothermal",
                   "16": "wood and wood-derived fuels", 
                   "18": "other biomass",
                   "20": "other"}
    if cid: category_id = {cid: "self input category"}

    # url
    url_cid = "http://api.eia.gov/category/?api_key=" + api_key + "&category_id="
    url_sid = "http://api.eia.gov/series/"
    # url_sid0 = "http://api.eia.gov/series/?series_id="
    # url_sid1 = "&api_key=" + api_key + "&out=json"
    
    # dates
    update_date = datetime.now() # today's date
    ## warning: no timezone
    date_last_update_iso = date_last_update.isoformat() # in iso

    # init search
    series_updated, series_total = 0, 0
    series_list = []
    series_dict = defaultdict(lambda: defaultdict(list))

    # sort series_id by category/area/frequency
    caf = re.compile(r"ELEC\.GEN\.(.{2,4})-(.{2,3})-99\.([A-Z])")

    # find series to update
    for cid in category_id:        
        # url to search for series_id
        url0 = url_cid + cid

        # retrieve series_id
        for cat in load_json(url0)["category"]["childseries"]:

            # check last update of these series
            last = datetime.strptime(cat["updated"], "%d-%b-%y %I.%M.%S %p")

            # continue series_id only if new data on series
            if last < date_last_update: 
                series_total += 1
                continue

            # series_id
            series_updated += 1
            series_id = cat["series_id"]
            series_list.append(series_id)

            # units
            if cat["units"] != "thousand megawatthours":
                print "WARNING: units are {} for series_id {}" \
                      .format(cat["units"], series_id)
            
            # sort by area/frequency, all categories
            (c, a, f) = caf.match(series_id).groups()
            series_dict[f][a].append(series_id)

        # progress
        print "Updated {}/{} series.".format(series_updated, series_total)
        print "Newest category: {}: {}".format(cid, category_id[cid])

    # update series
    for f in series_dict:
        for a in series_dict[f]:
            
            # POST
            series = ';'.join(series_dict[f][a])
            params = {"series_id": series, 
                      "api_key": api_key, 
                      "out": "json",
                      "start": date_last_update_iso}
            r = requests.post(url_sid, params, stream=True)
            
            # save to file
            chunks = 0
            filename = "data/" +f+a
            with open(filename, 'wb') as fn:
                for chunk in r.iter_content():
                        fn.write(chunk)
                        chunks += 1
            print 'chunks', chunks, filename
    
    return update_date