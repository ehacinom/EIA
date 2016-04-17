#!/usr/local/bin/python

import json
import urllib
from datetime import datetime
import requests
import re 
from collections import defaultdict
from tqdm import tqdm

def default_cid():
    """
    OUTPUT
    default category_ids to check for series_ids to update
    
    """
    
    # default categories
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

    return category_id

def load_json(url):
    """
    INPUT
    str url
    
    OUTPUT
    dict json data
    
    Retrieves data through URL get.
    
    """
    
    url = urllib.urlopen(url)
    return json.load(url)

def search_categories(api_key, date_last_update, cid=0):
    """
    INPUT
    str api_key
    datetime.datetime() date_last_update
    (optional) str cid
    
    OUTPUT
    dict series_dict (sorted by d[freq][area])
    
    First half of updating data used in the EIA graphs. Search categories
    for series_ids that need to be updated.
    
    If no cid is supplied, we check the default category_id to 
    retrieve all series_IDs we need to update.
    
    """

    # categories
    if cid: 
        if len(cid) == 1: category_id = {cid: "input"}
        else: category_id = {c: "input" for c in cid}
    else:
        category_id = default_cid()

    # url
    url_cid = "http://api.eia.gov/category/?api_key=" + api_key + "&category_id="

    # sort series_id by category/area/frequency
    caf = re.compile(r"ELEC\.GEN\.(.{2,4})-(.{2,3})-99\.([A-Z])")

    # init search
    series_updated, series_total = 0, 0
    series_dict = defaultdict(lambda: defaultdict(list))

    for cid in category_id:
        # retrieve list of series_id
        for cat in load_json(url_cid + cid)["category"]["childseries"]:

            # check last update of these series
            last = datetime.strptime(cat["updated"], "%d-%b-%y %I.%M.%S %p")

            # continue series_id only if new data
            if last < date_last_update: 
                series_total += 1
                continue

            series_id = cat["series_id"]

            # units
            if cat["units"] != "thousand megawatthours":
                print "WARNING: units are {} for series_id {}" \
                      .format(cat["units"], series_id)
            
            # sort by area/frequency, all categories
            (c, a, f) = caf.match(series_id).groups()
            series_dict[f][a].append(series_id)
            
            series_updated += 1
            series_total += 1

        # progress
        print "Updated {}/{} series.".format(series_updated, series_total)
        print "Newest category: {}: {}".format(cid, category_id[cid])

    return series_dict

def update_series(api_key, date_last_update, series_dict, key):
    """
    INPUT
    str api_key
    datetime date_last_update
    dict series_dict, from search_categories()
    key: 3-tuple of string parent/child/value identifiers
    
    OUTPUT
    datetime update_date, date of current update
    
    Second half of updating data. Taking the series_id we have found, POST-ing
    to the EIA website to retrieve series in bulk, and filtering out metadata
    from the resultant stream. 
    
    Next steps: connection pooling and HTTP persistant connection with 
    requests.Session(). Implement timezone for date_last_update. Most
    important: making this UPDATE files! That means opening json files, 
    inserting data into correct key:value, putting it back in: and all 
    hopefully done without too much slowing down.
    
    """
    
    # url
    url_sid = "http://api.eia.gov/series/"
    
    # dates
    update_date = datetime.now()
    date_last_update_iso = date_last_update.isoformat() # in iso
    
    # search stream for data
    stream = re.compile(r"(.+)]].+")

    # update series
    print '\nThree progress bars, one for each frequency.'
    for f in series_dict:
        for a in tqdm(series_dict[f]):
            #if f != 'A' : continue

            # list of series_ids
            ids = series_dict[f][a]
            length = len(ids)

            # POST
            series = ';'.join(ids)
            params = {"series_id": series, 
                      "api_key": api_key, 
                      "out": "json"}#,
                      #"start": date_last_update_iso}
            r = requests.post(url_sid, params, stream=True)
            
            # save to file
            filename = "data/" + f + a + '.json'
            with open(filename, 'wb') as fn:
                index = -1
                fn.write("{" + key[0] + ":\"" + a + "\"," + key[1] + ":[")
                
                for chunk in r.iter_lines(delimiter='[['):
                    
                    # for some reason, the second chunk of M-MN is nothing
                    # so we're just going to skip nothing chunks
                    if not chunk: continue
                    
                    # first chunk has no data
                    if index < 0:
                        index += 1
                        continue
                    
                    # data order == series order (WOW USEFUL)
                    name = "{" + key[0] + ":\"" + ids[index] + "\"," + \
                           key[2] + ":"

                    # search stream for data and recast
                    # it's not pretty
                    chunk = stream.match(chunk).groups()[0]
                    chunk = [":".join(c.split(",")) for c in chunk.split("],[")]
                    chunk = [c[:1] + "_" + c[1:] for c in chunk]
                    chunk = "{" + ",".join(chunk) + "}"
                    
                    # write
                    fn.write(name + chunk + "}")
                    
                    index += 1
                    if index < length: fn.write(",")

                fn.write("]}")

    return update_date

def update_data(api_key, date_last_update, cid=0, key = ("\"p\"", "\"c\"", "\"v\"")):
    """
    
    Runs the show.
    
    Currently, updating is not precise but overcompensates. This will be 
    addressed in later versions. Class implementation will be considered
    at that time, since if we're updating precisely it'll be really 
    helpful to keep tabs on updates.
    
    API documentation for EIA: http://www.eia.gov/opendata/commands.cfm
    
    Example usage
    =============
    
    # import
    from get_data import update_data
    from datetime import datetime
    
    # input
    api_key = "XXX"
    last_update = datetime(1990, 01, 01, 00, 00, 01, 0)

    # run both
    start = datetime.now()
    last_update = update_data(api_key, last_update)
    
    # output 
    print last_update
    print "elapsed: {}".format(datetime.now()-start)
    
    """
    
    series_dict = search_categories(api_key, date_last_update, cid)
    update_date = update_series(api_key, date_last_update, series_dict, key)
    
    return update_date