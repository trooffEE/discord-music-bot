const showAlbanianCoronavirus = () => {
  message.delete()
  // Note: https://covid-19-data.unstatshub.org/datasets/cases-country/api
  axios.get("https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases2_v1/FeatureServer/2/query?where=Country_Region%20%3D%20'ALBANIA'&outFields=Country_Region,Confirmed,Deaths&outSR=4326&f=json")
    .then(({ data }) => {
      const albania = data.features[0]

      const deaths = albania.attributes.Deaths
      const infected = albania.attributes.Confirmed
      const text = `:flag_al: Албанский коронавирус :flag_al:\nЗаражено: ${infected}\nПомэрло: ${deaths}`

      sendSelfDestroyMessage(message, text, null, 60_000)
    })
    .catch(notifyError)
}

module.exports.showAlbanianCoronavirus = showAlbanianCoronavirus