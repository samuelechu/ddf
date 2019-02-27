/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details. A copy of the GNU Lesser General Public License is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
import * as React from 'react'
import styled from '../../styles/styled-components'
import { hot } from 'react-hot-loader'
import { Attribute, Coordinates, Props } from '.'
import { formatAttribute, formatCoordinates } from './formatting'

export const validCoordinates = ({ lat, lon }: Coordinates) =>
  typeof lat !== 'undefined' && typeof lon !== 'undefined'

const Root = styled<Props, 'div'>('div')`
  font-family: 'Inconsolata', 'Lucida Console', monospace;
  background: ${props => props.theme.backgroundModal};
  display: ${props => {
    return validCoordinates(props) ? `block` : `none`
  }};
  width: auto;
  height: auto;
  font-size: ${props => props.theme.minimumFontSize};
  position: absolute;
  left: 0px;
  bottom: 0px;
  text-align: left;
  padding: ${props => props.theme.minimumSpacing};
  max-width: 50%;
`
const CoordinateInfo = styled.div`
  white-space: pre;
  display: inline-block;
`
const MetacardInfo = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const metacardInfo = ({ attributes }: Props) =>
  attributes.map(({ name, value }: Attribute) => (
    <MetacardInfo>{formatAttribute({ name, value })}</MetacardInfo>
  ))

const render = (props: Props) => {
  const coordinates = formatCoordinates(props)
  return (
    <Root {...props}>
      {metacardInfo(props)}
      <CoordinateInfo>
        <span>{coordinates}</span>
      </CoordinateInfo>
    </Root>
  )
}

export default hot(module)(render)