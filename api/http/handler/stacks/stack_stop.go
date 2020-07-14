package stacks

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

// POST request on /api/stacks/:id/stop
func (handler *Handler) stackStop(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(stackID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	if stack.Status == portainer.StackStatusInactive {
		return &httperror.HandlerError{http.StatusBadRequest, "Stack is already inactive", errors.New("Stack is already inactive")}
	}

	//...

	stack.Status = portainer.StackStatusInactive
	err = handler.DataStore.Stack().UpdateStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update stack status", err}
	}

	return response.JSON(w, stack)
}
