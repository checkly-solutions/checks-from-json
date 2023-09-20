# Sample Project

## Important commands

* npx checkly test 
triggers a test without recording to the app

* npx checkly test --record
triggers a test and provides a link after completing

* npx checkly trigger 
triggers all existing checks in the app

* npx checkly deploy
deploys all resources tied to the current project

* npx checkly destroy
destroys any resources associated with the current project

## Context for Repo
The idea for this project is create a sample repository that will allow teams to get up and using Checkly easily.

Based on my conversation with Alok, it sounded like for a given team or work group there was a list of URLs that were associated with three tiers of critacality; info, high & critical.

App
  - info
    -- url
  - high
    -- url
  - critical
    -- url

This repository was made under the assumption that each team or work group was going to implement monitoring for specific apps they're responsible for. 


## Structure with Notes

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


## Next steps

The current example should be refactored to call the individual resources into the json-checks.check.ts file, but this is not blocking for the current implementation. 