# Sherwin Sample Project

## Context for Repo
The idea for this project is create a sample repository that will allow teams to get up and using Checkly easily.

Based on my conversation with Alok, it sounded like for a given team or work group there was a list of URLs that were associated with three tiers of critacality; info, high & critical.

This repository was made under the assumption that each team or work group was going to implement monitoring for specific apps under their responsibility. 


## Structure

We can look at this repository in as providers (resources) and consumers. 

- src
  -- __checks__
    --- json-checks.check.ts
      Allows for the importing of resources from checkly and the current repository.
      We read the sherwinExternalURLs.json file and create a series of resources from them based on the structure of the array of objects.

    --- demo-checks.test.ts
      unused reference resource
    --- demo-group.test.ts 
      unused reference resource
  -- tests
    unused reference resource

  -- urlList
    --- sherwinExternalURLs.json
    An array of objects that contain the app name of what the repository is responsible for, the rating of the url, the method we reach the URL by, and whether that URL is activated.

  -- alert-channels.ts
  alerts are being imported in the json-checks.check.ts file

  -- dashboards.ts
  unused reference resource

  -- maintenance-windows.ts 
  unsured reference resource

  -- checkly.config.ts 
  This is what provides default settings for the checks deployed with this project.
