using hashingsample.Model;
using Microsoft.AspNetCore.Mvc;

namespace hashingsample.Controller {
    [Route("api/[controller]")]
    [ApiController]
    public class CaseController : ControllerBase {
        [HttpGet("encode-caseid/{caseId}")]
        public IActionResult EncodeCaseId([ModelBinder(typeof(HashidsModelBinder))] string caseId) {
            if (string.IsNullOrEmpty(caseId))
                return BadRequest("Case ID cannot be empty");

            return Ok(new { hasedId = caseId });
        }

        [HttpGet("decode-caseid/{hashedId}")]
        public IActionResult DecodeCaseId(string hashedId) {
            if (string.IsNullOrEmpty(hashedId))
                return BadRequest("Hashed ID cannot be empty");

            var originalId = CaseIdHasher.Decode(hashedId);

            return Ok(new { HashedId = hashedId, OriginalId = originalId });
        }
        [HttpPost()]
        public IActionResult PostCase(Command req) {

            return Ok(new { OriginalId = req.CaseId });
        }

    }
}
