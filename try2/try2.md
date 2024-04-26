Heres a list of progressively more interesting incarnations, each is run by calling the script in try.html

# 20 Start
could be made more simple...
- draws a globe (radius 1)
- colors globe from some wms

# 21 
- added wheel listener 
- zooms on wheel

# 22 
- sets a zoom limit (1 to 3)

# 23 
 - attempts some zoom smoothing (WIP)
 - started logging zoom level and zoomfactor
 - let zoomfactor vary to the power of camera position z /5
 - fixed the camera zoom to 1.1 (from 1.0) to avoid clipping
 - added panFactor to set panning speed by camera position z