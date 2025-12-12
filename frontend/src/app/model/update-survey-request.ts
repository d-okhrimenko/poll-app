export interface UpdateSurveyRequest {
  question: string,
  options:
  {
    id?: string,
    text: string
  }[]
}
