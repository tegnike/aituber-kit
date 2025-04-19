import { v4 as uuidv4 } from 'uuid'

/**
 * メッセージ用の一意なIDを生成します。
 * @returns 生成されたID (例: "msg_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
 */
export const generateMessageId = (): string => `msg_${uuidv4()}`
