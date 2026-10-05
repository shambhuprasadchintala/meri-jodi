import axiosInstance from "./axiosInstance"

const unwrap = (response) => response.data?.data ?? response.data

export const getConversations = async () => {
  const response = await axiosInstance.get("/messages/conversations")
  return unwrap(response)
}

export const getConversationHistory = async (profileId, page = 1, limit = 50) => {
  const response = await axiosInstance.get(`/messages/conversation/${profileId}`, {
    params: { page, limit },
  })
  return unwrap(response)
}

export const sendMessageRest = async (receiverProfileId, content) => {
  const response = await axiosInstance.post("/messages", { receiverProfileId, content })
  return unwrap(response)
}

export const getUnreadCount = async () => {
  const response = await axiosInstance.get("/messages/unread-count")
  return unwrap(response)
}

// [COMMENTED OUT: AI CHAT SUGGESTIONS]
export const getChatSuggestions = async (partnerDetails, lastMessage = "", category = "icebreaker") => {
  const firstName = partnerDetails?.name ? partnerDetails.name.split(" ")[0] : "there"
  return [
    `Hi ${firstName}! I came across your profile and would love to connect.`,
    `Hello ${firstName}! How is your day going?`,
    `Namaste ${firstName}! I'd love to know more about your hobbies and interests.`,
    `Hi ${firstName}! I liked your profile and thought we might share similar values.`,
  ]
}
