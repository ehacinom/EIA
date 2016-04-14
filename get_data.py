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

def update_json_post(api_key, last_update, cid=0):
    """
    INPUT
    str api_key
    datetime.datetime() last_update
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
    if cid: category_id = list(cid)
    
    # urls used
    url_cid = "http://api.eia.gov/category/?api_key=" + api_key + "&category_id="
    url_sid0 = "http://api.eia.gov/series/?series_id="
    url_sid1 = "&api_key=" + api_key + "&out=json"
    url_sid = "http://api.eia.gov/series/" # for post

    # today's date
    update_date = datetime.now()

    # find series to update
    series_updated, series_total = 0, 0
    series_list = []
    for cid in category_id:        
        # url to search for series_id
        url0 = url_cid + cid

        # retrieve series_id
        for cat in load_json(url0)["category"]["childseries"]:
            series_total += 1
            
            # check last update of these series
            last = datetime.strptime(cat["updated"], "%d-%b-%y %I.%M.%S %p")

            # retrieve series_id only if last_update < last
            if last < last_update: continue

            # retrieve series_id
            series_updated += 1
            series_id = cat["series_id"]
            
            # retrieve location
            series_list.append(series_id)

            # retrieve units
            if cat["units"] != "thousand megawatthours":
                print "WARNINGL units are {} for series_id {}" \
                      .format(cat["units"], series_id)
            
            # url to get series
            # url1 = url_sid0 + series_id + url_sid1
            # for s in load_json(url1)["series"]:
            #     print s
            #     break
            # break

        print "Updated {}/{} series.".format(series_updated, series_total)
        print "Newest category: {}: {}".format(cid, category_id[cid])

    # sort series_list by category/area/frequency
    cate_area_freq = re.compile(r"ELEC\.GEN\.(.{2,4})-(.{2,3})-99\.([A-Z])")
    sd = defaultdict(lambda: defaultdict(list))
    for sl in series_list:
        (cate, area, freq) = cate_area_freq.match(sl).groups()
        
        # easiest to filter on frequency and areas, will show all categories!
        sd[freq][area].append(sl)
    
    # get the timeseries using POST protocol
    # this is not updatable (!!!)
    # must fix later
    
    dataset = defaultdict(dict)
    for f in sd:
        for a in sd[f]:
            series = ';'.join(sd[f][a])
            params = {"series_id": series, "api_key": api_key, "out": "json"}
            r = requests.post(url_sid, params)
            
            # save to dataset
            dataset[f][a] = r.content

    # write to file
    with open('dataset.json', 'w') as f:
        json.dump(dataset, f)
    
    return update_date
    
def update_json(api_key, last_update, cid=0):
    """
    INPUT
    str api_key
    datetime.datetime() last_update
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
                   "11": "nuclear"}
                   # ,"12": "conventional hydroelectric",
                   # "19": "hydro-electric pumped storage",
                   # "13": "other renewables (total)",
                   # "14": "wind",
                   # "15": "all utility-scale solar",
                   # "1718408": "all solar",
                   # "1718400": "utility-scale photovoltaic",
                   # "1718409": "distributed solar",
                   # "1718401": "utility-scale thermal",
                   # "17": "geothermal",
                   # "16": "wood and wood-derived fuels",
                   # "18": "other biomass",
                   # "20": "other"}
    if cid: category_id = list(cid)
    
    # urls used
    url_cid = "http://api.eia.gov/category/?api_key=" + api_key + "&category_id="
    url_sid0 = "http://api.eia.gov/series/?series_id="
    url_sid1 = "&api_key=" + api_key + "&out=json"
    url_sid = "http://api.eia.gov/series/" # for post

    # today's date
    update_date = datetime.now()

    # find series to update
    series_updated, series_total = 0, 0
    series_list = []
    for cid in category_id:        
        # url to search for series_id
        url0 = url_cid + cid

        # retrieve series_id
        for cat in load_json(url0)["category"]["childseries"]:
            series_total += 1
            
            # check last update of these series
            last = datetime.strptime(cat["updated"], "%d-%b-%y %I.%M.%S %p")

            # retrieve series_id only if last_update < last
            if last < last_update: continue

            # retrieve series_id
            series_updated += 1
            series_id = cat["series_id"]
            
            # retrieve location
            series_list.append(series_id)

            # retrieve units
            if cat["units"] != "thousand megawatthours":
                print "WARNINGL units are {} for series_id {}" \
                      .format(cat["units"], series_id)
            
            # url to get series
            # url1 = url_sid0 + series_id + url_sid1
            # for s in load_json(url1)["series"]:
            #     print s
            #     break
            # break

        print "Updated {}/{} series.".format(series_updated, series_total)
        print "Newest category: {}: {}".format(cid, category_id[cid])

    # sort series_list by category/area/frequency
    cate_area_freq = re.compile(r"ELEC\.GEN\.(.{2,4})-(.{2,3})-99\.([A-Z])")
    sd = defaultdict(lambda: defaultdict(list))
    for sl in series_list:
        (cate, area, freq) = cate_area_freq.match(sl).groups()
        
        # easiest to filter on frequency and areas, will show all categories!
        sd[freq][area].append(sl)
    
    # url to get series
    dataset = defaultdict(lambda: defaultdict(dict))
    for f in sd:
        for a in sd[f]:
            for sid in sd[f][a]:
                url1 = url_sid0 + sid + url_sid1
                
                # save to dataset
                dataset[f][a][sid] = load_json(url1)["series"][0]["data"]
    
    # write to file
    with open('data.json', 'w') as f:
        json.dump(dataset, f)
    
    return update_date