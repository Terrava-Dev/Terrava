import axios from "axios"

async function postImages(url: string, files: File[], fieldName: "files" | "file") {
  const formData = new FormData()
  files.forEach((file) => formData.append(fieldName, file))

  return axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export async function uploadPropertyImages(url: string, files: File[]) {
  if (files.length === 0) return

  try {
    await postImages(url, files, "files")
  } catch (error) {
    await postImages(url, files, "file")
  }
}
