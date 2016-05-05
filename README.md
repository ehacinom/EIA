Electricity generation by utility scale facilities
=====

Project started April 2016

When running script_with_key.py:
* update_json_post() goes with the larger, more metadata file, dataset.json (5.5MB)
* update_json() goes with data.json (now with p/c/v)
* update_json() goes with datab.json (huge file with name/children/size tags.... will have to fix)

Any files this big are too big to transmit. Currently working on making them more concise for the bubble-chord-arc halo end.

Fuel Types
====

 "1": "all fuels" 
        (fossil fuels)
              "4": "coal"
              "7": "petroleum liquids"
              "8": "petroleum coke"
              "9": "natural gas"
              "10": "other gases"
        (nuclear)
              "11": "nuclear"
        (hydro)
              "12": "conventional hydroelectric"
              "19": "hydro-electric pumped storage"
        (biomass)
              "16": "wood and wood-derived fuels"
              "18": "other biomass"
        (other renewables)
              "13": "other renewables (total)"
                     (wind)
                            "14": "wind"
                     (solar)
                            "1718408": "all solar"
                                   "15": "all utility-scale solar"
                                          "1718400": "utility-scale photovoltaic"
                                          "1718401": "utility-scale thermal"
                                   "1718409": "distributed solar"
                     (geothermal)
                            "17": "geothermal"
        (other)
              "20": "other"