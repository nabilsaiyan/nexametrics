interface AvatarProps {
  src: string
  alt: string
  size?: number
}

export function Avatar({ src, alt, size = 32 }: AvatarProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid rgba(19, 239, 255, 0.15)',
        background: '#0d1f35',
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  )
}
