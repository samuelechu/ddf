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
const QueryAddView = require('../../../component/query-add/query-add.view.js')
import MarionetteRegionContainer from '../../container/marionette-region-container'
import WorkspaceTitle from '../workspace-title'
import Dropdown from '../dropdown'
import { Button, buttonTypeEnum } from '../../presentation/button'

type Props = {
  currentWorkspace: Backbone.Model
  saved: boolean
  branding: string
  product: string
}

const Root = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
`

const StyledSearchButton = styled(Button)`
  padding-left: ${({ theme }) => theme.minimumSpacing};
  padding-right: ${({ theme }) => theme.mediumSpacing};
  background-color: ${({ theme }) => theme.primaryColor};
`

const StyledWorkspaceTitle = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.largeSpacing};
`

const StyledDropdown = styled(Dropdown)`
  display: inline-block;
`

const StyledIcon = styled.span`
  width: ${props => props.theme.minimumButtonSize};
`

const render = (props: Props) => {
  const { currentWorkspace, saved, branding, product } = props

  const onInputChange = (title: string) => {
    currentWorkspace.set('title', title)
  }

  return (
    <Root>
      <StyledWorkspaceTitle>
        <WorkspaceTitle
          title={currentWorkspace.get('title')}
          saved={saved}
          onInputChange={onInputChange}
          onSave={() => currentWorkspace.save()}
          currentWorkspace={currentWorkspace}
        />
      </StyledWorkspaceTitle>

      <StyledSearchButton buttonType={buttonTypeEnum.primary}>
        <StyledDropdown
          className="content-adhoc"
          content={() => (
            <MarionetteRegionContainer
              view={QueryAddView}
              viewOptions={() => {
                return {
                  model: currentWorkspace,
                }
              }}
            />
          )}
        >
          <StyledIcon className="fa fa-search fa-fw" /> Search {branding}{' '}
          {product}
        </StyledDropdown>
      </StyledSearchButton>
    </Root>
  )
}

export default hot(module)(render)
