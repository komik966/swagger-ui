export const showDefinitions = (ori, {specActions}) => (payload) => {
  if (payload === false) {
    specActions.download()
  }
  return ori(payload)
}
