#include <iostream>
#include <vector>
#include <string>
#include <atomic>
#include <map>
#include "platform.h"

/**
 * Modified StatusMonitor for Media Streamer Backend
 * -----------------------------------------------
 * This version outputs a single JSON array of all detected DeckLink devices.
 * It includes signal status, temperature, and PCIe depth for "Pro" telemetry.
 */

struct FourCCNameMapping {
    INT32_UNSIGNED fourcc;
    const char* name;
};

static FourCCNameMapping kPixelFormatMappings[] = {
    { bmdFormat8BitYUV,     "8-bit YUV" },
    { bmdFormat10BitYUV,    "10-bit YUV" },
    { bmdFormat8BitARGB,    "8-bit ARGB" },
    { bmdFormat8BitBGRA,    "8-bit BGRA" },
    { bmdFormat10BitRGB,    "10-bit RGB" },
    { bmdFormat12BitRGB,    "12-bit RGB" },
    { bmdFormatH265,        "H.265" },
    { 0, NULL }
};

static const char* getFourCCName(FourCCNameMapping* mappings, INT32_UNSIGNED fourcc) {
    while (mappings->name != NULL) {
        if (mappings->fourcc == fourcc) return mappings->name;
        ++mappings;
    }
    return "Unknown";
}

std::string getDisplayModeName(IDeckLinkStatus* deckLinkStatus, BMDDisplayMode displayMode) {
    IDeckLinkInput*       deckLinkInput = NULL;
    IDeckLinkDisplayMode* deckLinkDisplayMode = NULL;
    STRINGOBJ             displayModeString;
    std::string           modeName = "No Signal";

    if (deckLinkStatus->QueryInterface(IID_IDeckLinkInput, (void**)&deckLinkInput) != S_OK) goto bail;
    if (deckLinkInput->GetDisplayMode(displayMode, &deckLinkDisplayMode) != S_OK) goto bail;
    if (deckLinkDisplayMode->GetName(&displayModeString) == S_OK) {
        StringToStdString(displayModeString, modeName);
        STRINGFREE(displayModeString);
    }

bail:
    if (deckLinkInput) deckLinkInput->Release();
    if (deckLinkDisplayMode) deckLinkDisplayMode->Release();
    return modeName;
}

std::string escapeJson(const std::string& s) {
    std::string res;
    for (char c : s) {
        if (c == '"') res += "\\\"";
        else if (c == '\\') res += "\\\\";
        else res += c;
    }
    return res;
}

void processDevice(IDeckLink* deckLink, int index, bool isLast) {
    IDeckLinkStatus* deckLinkStatus = NULL;
    STRINGOBJ        displayName;
    std::string      nameStr = "Unknown";
    HRESULT          res;

    if (deckLink->GetDisplayName(&displayName) == S_OK) {
        StringToStdString(displayName, nameStr);
        STRINGFREE(displayName);
    }

    std::cout << "  {" << std::endl;
    std::cout << "    \"id\": \"decklink_" << index << "\"," << std::endl;
    std::cout << "    \"device_number\": " << index << "," << std::endl;
    std::cout << "    \"name\": \"" << escapeJson(nameStr) << "\"," << std::endl;

    if (deckLink->QueryInterface(IID_IDeckLinkStatus, (void**)&deckLinkStatus) == S_OK) {
        INT64_SIGNED intVal;
        BOOL         boolVal;

        // Temperature
        if (deckLinkStatus->GetInt(bmdDeckLinkStatusDeviceTemperature, &intVal) == S_OK)
            std::cout << "    \"temperature\": " << intVal << "," << std::endl;

        // PCIe Link
        if (deckLinkStatus->GetInt(bmdDeckLinkStatusPCIExpressLinkWidth, &intVal) == S_OK)
            std::cout << "    \"pcie_width\": " << intVal << "," << std::endl;

        // Signal Lock
        bool hasSignal = false;
        if (deckLinkStatus->getFlag(bmdDeckLinkStatusVideoInputSignalLocked, &boolVal) == S_OK)
            hasSignal = (boolVal == TRUE);
        
        std::cout << "    \"inputs\": [{" << std::endl;
        std::cout << "      \"id\": \"input_" << index << "\"," << std::endl;
        std::cout << "      \"port\": \"SDI\"," << std::endl;
        std::cout << "      \"signal_detected\": " << (hasSignal ? "true" : "false") << "," << std::endl;
        
        std::string mode = "No Signal";
        if (hasSignal && deckLinkStatus->GetInt(bmdDeckLinkStatusDetectedVideoInputMode, &intVal) == S_OK) {
            mode = getDisplayModeName(deckLinkStatus, (BMDDisplayMode)intVal);
        }
        std::cout << "      \"format\": \"" << mode << "\"," << std::endl;
        std::cout << "      \"active\": false" << std::endl;
        std::cout << "    }]" << std::endl;

        deckLinkStatus->Release();
    } else {
        std::cout << "    \"inputs\": []" << std::endl;
    }

    std::cout << "  }" << (isLast ? "" : ",") << std::endl;
}

int main(int argc, const char * argv[]) {
    IDeckLinkIterator* deckLinkIterator = NULL;
    IDeckLink*         deckLink = NULL;
    std::vector<IDeckLink*> detectedDevices;

    Initialize();

    if (GetDeckLinkIterator(&deckLinkIterator) != S_OK) {
        std::cout << "[]" << std::endl;
        return 1;
    }

    while (deckLinkIterator->Next(&deckLink) == S_OK) {
        detectedDevices.push_back(deckLink);
    }

    std::cout << "[" << std::endl;
    for (size_t i = 0; i < detectedDevices.size(); ++i) {
        processDevice(detectedDevices[i], i, i == detectedDevices.size() - 1);
        detectedDevices[i]->Release();
    }
    std::cout << "]" << std::endl;

    deckLinkIterator->Release();
    return 0;
}
