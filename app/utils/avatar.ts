const CLOUDBASE_FILE_ID_PREFIX = 'cloud://'
const AVATAR_PATH_PREFIX = '/avatars/'

export type GetTempFileURL = (options: { fileList: string[] }) => Promise<unknown>

/**
 * 把旧的 CloudBase 临时头像地址还原为可长期保存的文件 ID。
 * 第三方 OAuth 头像地址保持原样。
 */
export function toCloudbaseAvatarFileID(
  value: string | null | undefined,
  envId: string,
): string | null {
  const source = value?.trim()
  if (!source)
    return null
  if (source.startsWith(CLOUDBASE_FILE_ID_PREFIX))
    return source
  if (!envId)
    return null

  try {
    const url = new URL(source)
    const pathname = decodeURIComponent(url.pathname)
    if (!pathname.startsWith(AVATAR_PATH_PREFIX))
      return null

    const tcbSuffix = '.tcb.qcloud.la'
    const cosMarker = '.cos.'
    const bucket = url.hostname.endsWith(tcbSuffix)
      ? url.hostname.slice(0, -tcbSuffix.length)
      : url.hostname.includes(cosMarker)
        ? url.hostname.slice(0, url.hostname.indexOf(cosMarker))
        : ''

    return bucket ? `cloud://${envId}.${bucket}${pathname}` : null
  }
  catch {
    return null
  }
}

export function pickTempFileURL(result: unknown, fileID: string): string | undefined {
  if (!result || typeof result !== 'object')
    return undefined

  const fileList = (result as { fileList?: unknown }).fileList
  if (!Array.isArray(fileList))
    return undefined

  const item = fileList.find(file =>
    file
    && typeof file === 'object'
    && (file as { fileID?: unknown }).fileID === fileID,
  ) || fileList[0]
  const tempFileURL = item && typeof item === 'object'
    ? (item as { tempFileURL?: unknown }).tempFileURL
    : undefined

  return typeof tempFileURL === 'string' && tempFileURL ? tempFileURL : undefined
}

/** 把头像来源解析为当前浏览器可访问的 URL。 */
export async function resolveAvatarUrl(
  value: string | null | undefined,
  envId: string,
  getTempFileURL: GetTempFileURL,
): Promise<string | undefined> {
  const source = value?.trim()
  if (!source)
    return undefined

  const fileID = toCloudbaseAvatarFileID(source, envId)
  if (!fileID)
    return source

  try {
    const result = await getTempFileURL({ fileList: [fileID] })
    return pickTempFileURL(result, fileID)
  }
  catch {
    return undefined
  }
}
