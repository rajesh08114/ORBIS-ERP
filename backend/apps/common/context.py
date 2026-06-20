from contextvars import ContextVar


current_actor = ContextVar("current_actor", default=None)
current_ip_address = ContextVar("current_ip_address", default=None)
current_request_id = ContextVar("current_request_id", default=None)


def set_request_context(*, actor=None, ip_address=None, request_id=None) -> None:
    current_actor.set(actor)
    current_ip_address.set(ip_address)
    current_request_id.set(request_id)


def get_current_actor():
    return current_actor.get()


def get_current_ip_address():
    return current_ip_address.get()


def get_current_request_id():
    return current_request_id.get()

