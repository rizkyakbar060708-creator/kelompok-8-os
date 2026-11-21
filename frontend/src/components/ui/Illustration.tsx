interface IllustrationProps {
  src: string
  alt: string
  className?: string
  width?: number | string
  height?: number | string
}

function Illustration({
  src,
  alt,
  className = "",
  width,
  height,
}: IllustrationProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`block ${className}`}
      loading="lazy"
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        objectFit: "contain",
      }}
    />
  )
}

export default Illustration
