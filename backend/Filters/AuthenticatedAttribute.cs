using Microsoft.AspNetCore.Mvc;

namespace backend.Filters {
    public class AuthenticatedAttribute : TypeFilterAttribute {
        public AuthenticatedAttribute() : base(typeof(AuthFilter)) {
        }
    }
}
