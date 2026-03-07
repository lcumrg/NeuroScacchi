import { useState, useCallback } from 'react'
import VersionSelector from './VersionSelector'
import AppV1 from './v1/App'
import AppV2 from './v2/App'

export default function App() {
  const [version, setVersion] = useState(null)

  const handleSelect = useCallback((v) => {
    setVersion(v)
  }, [])

  if (!version) {
    return <VersionSelector onSelect={handleSelect} />
  }

  if (version === 'v2') {
    return <AppV2 />
  }

  return <AppV1 />
}
