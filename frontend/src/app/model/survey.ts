export interface Survey {
  id: string,
  question: string,
  options: [
    {
      id: string,
      text: string
    }
  ],
  publicId: string,
  createdAt: Date
}
