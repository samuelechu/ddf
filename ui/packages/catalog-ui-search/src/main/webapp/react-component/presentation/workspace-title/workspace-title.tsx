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
import UnsavedIndicator from '../unsaved-indicator'
import SaveButton from '../save-button'
import Dropdown from '../dropdown'
import WorkspaceInteractions from '../../container/workspace-interactions'
import NavigationBehavior from '../navigation-behavior'

type Props = {
  title?: string
  onInputChange: (value: string) => void
  onSave: () => void
  saved: boolean
  currentWorkspace: Backbone.Model
}

const Root = styled.div`
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.minimumSpacing};
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${({ theme }) => theme.minimumButtonSize};
  border: 2px solid rgba(255, 255, 255, 0.1);
`

const StyledTitle = styled.input`
  height: ${({ theme }) => theme.minimumButtonSize};
  line-height: 1;
  font-size: ${({ theme }) => theme.largeFontSize};
  background: transparent;
  border: none;
  overflow: visible;
  text-overflow: ellipsis;
  cursor: pointer;
  padding: ${({ theme }) => theme.minimumSpacing};
  margin-right: ${({ theme }) => theme.minimumSpacing};

  *:focus {
    outline: none;
  }

  &:hover {
    text-decoration: underline;
  }
`

const StyledUnsavedIndicator = styled.span`
  position: absolute;
  font-size: ${({ theme }) => theme.largeFontSize};
  right: 80%;
  bottom: calc(-1rem + 1.2 * ${({ theme }) => theme.minimumSpacing});
`

const StyledSaveButton = styled.div`
  line-height: 1;
  button {
    height: calc(${({ theme }) => theme.minimumButtonSize});
    line-height: 1;
    font-size: ${({ theme }) => theme.largeFontSize};
  }
  span {
    height: ${({ theme }) => theme.minimumButtonSize};
    font-size: ${({ theme }) => theme.largeFontSize};
    padding: ${({ theme }) => theme.minimumSpacing};
  }
`

const StyledMenu = styled(Dropdown)`
  height: calc(${({ theme }) => theme.minimumButtonSize});
  line-height: 1;
  font-size: ${({ theme }) => theme.largeFontSize};
  text-align: center;
  padding: ${({ theme }) => theme.minimumSpacing};
  border-left: 2px solid rgba(255, 255, 255, 0.1);
`

const StyledUnsaved = styled.span`
  position: relative;
`

const WorkspaceTitle = (props: Props) => {
  const { title, onInputChange, saved, onSave, currentWorkspace } = props
  return (
    <Root>
      <Wrapper>
        <StyledTitle
          placeholder="Workspace Title"
          value={title}
          data-help="This is the title of the workspace you are currently in.
          If you have permission, you can click here to start editing the title."
          onInput={(e: React.FormEvent<HTMLInputElement>) => {
            onInputChange(e.currentTarget.value)
          }}
        />

        <StyledUnsaved>
          <StyledUnsavedIndicator>
            <UnsavedIndicator shown={!saved} />
          </StyledUnsavedIndicator>
          <StyledSaveButton>
            <SaveButton isSaved={saved} onClick={onSave} />
          </StyledSaveButton>
        </StyledUnsaved>

        <StyledMenu
          content={() => (
            <NavigationBehavior>
              <WorkspaceInteractions workspace={currentWorkspace} />
            </NavigationBehavior>
          )}
        >
          <span className="fa fa-ellipsis-v" />
        </StyledMenu>
      </Wrapper>
    </Root>
  )
}

export default hot(module)(WorkspaceTitle)
