/* global Promise */

import { createSelector } from "reselect"
import { Map } from "immutable"
import assign from 'lodash/assign'
import btoa from 'btoa'

export default function downloadUrlPlugin (toolbox) {
  let { fn } = toolbox

  const actions = {
    download: (url)=> ({ errActions, specSelectors, specActions, authSelectors }) => {
      let { fetch } = fn
      url = url || specSelectors.url()
      specActions.updateLoadingStatus("loading")

      const request = {
        url,
        loadSpec: true,
        credentials: "same-origin",
        headers: {
          "Accept": "application/json,*/*"
        }
      };

      const requestWithSecurity = applySecurities(request, authSelectors.authorized())

      fetch(requestWithSecurity).then(next, next)

      function next(res) {
        if(res instanceof Error || res.status >= 400) {
          specActions.updateLoadingStatus("failed")
          return errActions.newThrownErr( new Error(res.statusText + " " + url) )
        }
        specActions.updateLoadingStatus("success")
        specActions.updateSpec(res.text)
        specActions.updateUrl(url)
      }

      function applySecurities(request, securities) {
        const result = assign({}, request)

        result.headers = result.headers || {}
        result.query = result.query || {}

        securities.forEach((securityObj) => {
          const token = securityObj.get('token')
          const value = securityObj.get('value')
          const schema = securityObj.get('schema')
          const type = schema.get('type')
          const accessToken = token && token.access_token
          const tokenType = token && token.token_type

          if (type === 'apiKey') {
            const inType = schema.get('in') === 'query' ? 'query' : 'headers'
            result[inType] = result[inType] || {}
            result[inType][schema.get('name')] = value
          } else if (type === 'basic') {
            if (value.header) {
              result.headers.authorization = value.header
            } else {
              value.base64 = btoa(`${value.username}:${value.password}`)
              result.headers.authorization = `Basic ${value.base64}`
            }
          } else if (type === 'oauth2') {
            result.headers.authorization = `${tokenType || 'Bearer'} ${accessToken}`
          }
        })
        return result
      }

    },

    updateLoadingStatus: (status) => {
      let enums = [null, "loading", "failed", "success", "failedConfig"]
      if(enums.indexOf(status) === -1) {
        console.error(`Error: ${status} is not one of ${JSON.stringify(enums)}`)
      }

      return {
        type: "spec_update_loading_status",
        payload: status
      }
    }
  }

  let reducers = {
    "spec_update_loading_status": (state, action) => {
      return (typeof action.payload === "string")
        ? state.set("loadingStatus", action.payload)
        : state
    }
  }

  let selectors = {
    loadingStatus: createSelector(
      state => {
        return state || Map()
      },
      spec => spec.get("loadingStatus") || null
    )
  }

  return {
    statePlugins: {
      spec: { actions, reducers, selectors }
    }
  }
}
