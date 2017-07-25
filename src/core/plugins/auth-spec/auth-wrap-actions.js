export function authorize(ori, {specActions, authActions}) {
  specActions.download()
  authActions.showDefinitions(false)
  return ori
}

export function logout(ori, {specActions, authActions}) {
  specActions.download()
  authActions.showDefinitions(false)
  return ori
}
