import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

describe('setup dos testes', () => {
  it('render dos testes de unidade roda em StrictMode, como o app em desenvolvimento', () => {
    let mounts = 0
    function Probe() {
      useEffect(() => {
        mounts++
      }, [])
      return null
    }

    render(<Probe />)

    expect(mounts).toBe(2)
  })
})
