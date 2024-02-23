/**
 * This check will check the functionality of the Checkly check groups API  - It will create, get, update and delete a group.
 * The Checkly API documentation is available here: https://developers.checklyhq.com/reference
 */

import { test, expect } from "@playwright/test"

const baseUrl = "https://api.checklyhq.com/v1"

/**
 * The Checkly Public API uses API keys to authenticate requests.
 * You can generate a key for your account here: https://app.checklyhq.com/settings/user/api-keys
 */
const headers = {
  // Learn more about using environment variables here: https://www.checklyhq.com/docs/api-checks/variables
  // Authorization: `Bearer ${process.env.API_KEY}`,
  Authorization: `Bearer cu_64c9e87bcea0486a8f7e52fa759d51aa`,
  // "x-checkly-account": process.env.ACCOUNT_ID,
  "x-checkly-account": "70a705d3-488c-4ade-8f54-376ae7e974ba",
}

test("Verify Group API", async ({ request }) => {
  /**
   * Create a group
   */
  const group = await test.step("POST /check-groups", async () => {
    const response = await request.post(`${baseUrl}/check-groups/`, {
      data: {
        locations: ["eu-west-1"],
        name: "createdViaApiCheck",
      },
      headers,
    })
    expect(response).toBeOK()

    return response.json()
  })

  /**
   * Get the newly created group
   */
  await test.step("GET /check-groups/{id}", async () => {
    const response = await request.get(`${baseUrl}/check-groups/${group.id}`, {
      headers,
    })
    expect(response).toBeOK()

    const receivedGroup = await response.json()
    expect(receivedGroup.id).toEqual(group.id)
  })

  /**
   * Update the new group
   */
  await test.step("PUT /check-groups/{id}", async () => {
    const response = await request.put(`${baseUrl}/check-groups/${group.id}`, {
      data: {
        tags: ["public-api", "added-by-check"],
      },
      headers,
    })
    expect(response).toBeOK()
  })

  /**
   * Delete the new group
   */
  await test.step("DELETE /check-group/{id}", async () => {
    const response = await request.delete(
      `${baseUrl}/check-groups/${group.id}`,
      { headers },
    )
    expect(response).toBeOK()
  })
})