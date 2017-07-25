import * as authWrapActions from "./auth-wrap-actions"

export default function () {
  return {
    statePlugins: {
      auth: {
        wrapActions: authWrapActions
      }
    }
  }
}
