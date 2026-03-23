package com.starrupture.scanner.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.starrupture.scanner.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.Deflater;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SaveParserServiceTest {

    @Mock
    private SaveSessionRepository saveSessionRepository;
    @Mock
    private GameEntityRepository gameEntityRepository;
    @Mock
    private DroneLinkRepository droneLinkRepository;
    @Mock
    private RailSplineRepository railSplineRepository;
    @Mock
    private BaseZoneRepository baseZoneRepository;

    private SaveParserService service;

    @BeforeEach
    void setUp() {
        service = new SaveParserService(
                new ObjectMapper(),
                saveSessionRepository,
                gameEntityRepository,
                droneLinkRepository,
                railSplineRepository,
                baseZoneRepository
        );
    }

    @Nested
    @DisplayName("classify()")
    class ClassifyTests {

        @Test
        void shouldClassifyBaseCore() {
            assertThat(service.classify("/Game/Config/BaseCore_C")).isEqualTo("basecore");
        }

        @Test
        void shouldClassifySmelterAsMachine() {
            assertThat(service.classify("/Game/Config/Smelter_T2")).isEqualTo("machine");
        }

        @Test
        void shouldClassifyFabricatorAsMachine() {
            assertThat(service.classify("/Game/Config/Fabricator_Mk1")).isEqualTo("machine");
        }

        @Test
        void shouldClassifyAssemblerAsMachine() {
            assertThat(service.classify("/Game/Config/Assembler_Advanced")).isEqualTo("machine");
        }

        @Test
        void shouldClassifyMechanicalDrillAsMachine() {
            assertThat(service.classify("/Game/Config/MechanicalDrill_T1")).isEqualTo("machine");
        }

        @Test
        void shouldClassifyOreExcavatorAsMachine() {
            assertThat(service.classify("/Game/Config/OreExcavator")).isEqualTo("machine");
        }

        @Test
        void shouldClassifyItemPrinterAsMachine() {
            assertThat(service.classify("/Game/Config/ItemPrinter_Mk2")).isEqualTo("machine");
        }

        @Test
        void shouldClassifySolarAsEnergy() {
            assertThat(service.classify("/Game/Config/SolarPanel_T1")).isEqualTo("energy");
        }

        @Test
        void shouldClassifyGeneratorAsEnergy() {
            assertThat(service.classify("/Game/Config/Generator_Fuel")).isEqualTo("energy");
        }

        @Test
        void shouldClassifyAntennaAsAntenna() {
            assertThat(service.classify("/Game/Config/Antenna_Long")).isEqualTo("antenna");
        }

        @Test
        void shouldClassifyAntenaWithTypoAsAntenna() {
            assertThat(service.classify("/Game/Config/Antena_Short")).isEqualTo("antenna");
        }

        @Test
        void shouldClassifyInfectionCystAsDanger() {
            assertThat(service.classify("/Game/Config/InfectionCyst_Big")).isEqualTo("danger");
        }

        @Test
        void shouldClassifyFoundableAsLoot() {
            assertThat(service.classify("/Game/Config/Foundable_Crate")).isEqualTo("loot");
        }

        @Test
        void shouldClassifyPlatformAsInfra() {
            assertThat(service.classify("/Game/Config/Platform_Metal")).isEqualTo("infra");
        }

        @Test
        void shouldClassifyNullPathAsInfra() {
            assertThat(service.classify(null)).isEqualTo("infra");
        }

        @Test
        void shouldClassifyEmptyPathAsInfra() {
            assertThat(service.classify("")).isEqualTo("infra");
        }
    }

    @Nested
    @DisplayName("extractName()")
    class ExtractNameTests {

        @Test
        void shouldExtractNameFromPath() {
            assertThat(service.extractName("/Game/Config/Buildings/Smelter_C"))
                    .isEqualTo("Smelter");
        }

        @Test
        void shouldHandleNullPath() {
            assertThat(service.extractName(null)).isEqualTo("Unknown");
        }

        @Test
        void shouldHandleEmptyPath() {
            assertThat(service.extractName("")).isEqualTo("Unknown");
        }

        @Test
        void shouldExtractSimpleName() {
            assertThat(service.extractName("SolarPanel")).isEqualTo("SolarPanel");
        }
    }

    @Nested
    @DisplayName("extractRecipe()")
    class ExtractRecipeTests {

        @Test
        void shouldExtractRecipeFromFragment() {
            List<String> fragments = List.of(
                    "SelectedRecipe=\"Blueprint'/Game/Recipes/IronIngot.IronIngot'\""
            );
            assertThat(service.extractRecipe(fragments))
                    .isEqualTo("/Game/Recipes/IronIngot.IronIngot");
        }

        @Test
        void shouldReturnNullWhenNoRecipe() {
            List<String> fragments = List.of("SomeOtherData=123");
            assertThat(service.extractRecipe(fragments)).isNull();
        }

        @Test
        void shouldReturnNullForEmptyFragments() {
            assertThat(service.extractRecipe(List.of())).isNull();
        }
    }

    @Nested
    @DisplayName("extractInfection()")
    class ExtractInfectionTests {

        @Test
        void shouldExtractInfectionLevel() {
            List<String> fragments = List.of(
                    "CurrentInfectionLevel=0.75"
            );
            assertThat(service.extractInfection(fragments)).isEqualTo(0.75);
        }

        @Test
        void shouldReturnZeroWhenNoInfection() {
            List<String> fragments = List.of("SomeOtherData=123");
            assertThat(service.extractInfection(fragments)).isEqualTo(0.0);
        }

        @Test
        void shouldReturnZeroForEmptyFragments() {
            assertThat(service.extractInfection(List.of())).isEqualTo(0.0);
        }

        @Test
        void shouldHandleIntegerInfectionLevel() {
            List<String> fragments = List.of("CurrentInfectionLevel=3");
            assertThat(service.extractInfection(fragments)).isEqualTo(3.0);
        }
    }

    @Nested
    @DisplayName("extractSplinePoints()")
    class ExtractSplinePointsTests {

        @Test
        void shouldExtractSplinePoints() {
            List<String> fragments = List.of(
                    "Position=(X=100.5,Y=-200.3,Z=50.0) Position=(X=300.0,Y=400.0,Z=60.0)"
            );
            List<double[]> points = service.extractSplinePoints(fragments);
            assertThat(points).hasSize(2);
            assertThat(points.get(0)[0]).isEqualTo(100.5);
            assertThat(points.get(0)[1]).isEqualTo(-200.3);
            assertThat(points.get(1)[0]).isEqualTo(300.0);
            assertThat(points.get(1)[1]).isEqualTo(400.0);
        }

        @Test
        void shouldReturnEmptyForNoSplinePoints() {
            List<String> fragments = List.of("SomeOtherData=123");
            assertThat(service.extractSplinePoints(fragments)).isEmpty();
        }
    }

    @Nested
    @DisplayName("extractBoundingBox()")
    class ExtractBoundingBoxTests {

        @Test
        void shouldExtractBoundingBox() {
            List<String> fragments = List.of(
                    "CachedBoundingBox=(Min=(X=-100.5,Y=-200.3,Z=0),Max=(X=300.0,Y=400.0,Z=100))"
            );
            double[] bbox = service.extractBoundingBox(fragments);
            assertThat(bbox).isNotNull();
            assertThat(bbox[0]).isEqualTo(-100.5);
            assertThat(bbox[1]).isEqualTo(-200.3);
            assertThat(bbox[2]).isEqualTo(300.0);
            assertThat(bbox[3]).isEqualTo(400.0);
        }

        @Test
        void shouldReturnNullWhenNoBoundingBox() {
            List<String> fragments = List.of("SomeOtherData=123");
            assertThat(service.extractBoundingBox(fragments)).isNull();
        }
    }

    @Nested
    @DisplayName("decompressSav()")
    class DecompressTests {

        @Test
        void shouldDecompressValidData() throws Exception {
            String original = "{\"test\": true}";
            byte[] compressed = compressZlib(original);
            // Add 4-byte header
            byte[] withHeader = new byte[4 + compressed.length];
            System.arraycopy(compressed, 0, withHeader, 4, compressed.length);

            String result = service.decompressSav(withHeader);
            assertThat(result).isEqualTo(original);
        }

        @Test
        void shouldThrowOnTooSmallFile() {
            byte[] tiny = new byte[]{0x01, 0x02};
            assertThatThrownBy(() -> service.decompressSav(tiny))
                    .isInstanceOf(IOException.class)
                    .hasMessageContaining("too small");
        }

        @Test
        void shouldThrowOnInvalidZlibData() {
            byte[] invalid = new byte[]{0x00, 0x00, 0x00, 0x00, (byte) 0xFF, (byte) 0xFE, (byte) 0xFD};
            assertThatThrownBy(() -> service.decompressSav(invalid))
                    .isInstanceOf(IOException.class);
        }

        private byte[] compressZlib(String data) throws Exception {
            byte[] input = data.getBytes(StandardCharsets.UTF_8);
            Deflater deflater = new Deflater();
            deflater.setInput(input);
            deflater.finish();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[1024];
            while (!deflater.finished()) {
                int n = deflater.deflate(buf);
                baos.write(buf, 0, n);
            }
            deflater.end();
            return baos.toByteArray();
        }
    }

    @Nested
    @DisplayName("Regex patterns")
    class RegexPatternTests {

        @Test
        void recipePatterShouldMatch() {
            var matcher = SaveParserService.RECIPE.matcher(
                    "SelectedRecipe=\"Blueprint'/Game/Recipes/IronIngot.IronIngot'\""
            );
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("/Game/Recipes/IronIngot.IronIngot");
        }

        @Test
        void infectionPatternShouldMatch() {
            var matcher = SaveParserService.INFECTION.matcher("CurrentInfectionLevel=0.85");
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("0.85");
        }

        @Test
        void droneSrcPatternShouldMatch() {
            var matcher = SaveParserService.DRONE_SRC.matcher("CurrentMovementStart=(ID=246)");
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("246");
        }

        @Test
        void droneDstPatternShouldMatch() {
            var matcher = SaveParserService.DRONE_DST.matcher("CurrentMovementTarget=(ID=789)");
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("789");
        }

        @Test
        void droneItemPatternShouldMatch() {
            var matcher = SaveParserService.DRONE_ITEM.matcher("ItemDataBase=\"IronOre\"");
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("IronOre");
        }

        @Test
        void splinePointPatternShouldMatch() {
            var matcher = SaveParserService.SPLINE_PT.matcher("Position=(X=123.45,Y=-678.90");
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("123.45");
            assertThat(matcher.group(2)).isEqualTo("-678.90");
        }

        @Test
        void bboxPatternShouldMatch() {
            var matcher = SaveParserService.BBOX.matcher(
                    "CachedBoundingBox=(Min=(X=-50.0,Y=-100.0,Z=0),Max=(X=50.0,Y=100.0,Z=200))"
            );
            assertThat(matcher.find()).isTrue();
            assertThat(matcher.group(1)).isEqualTo("-50.0");
            assertThat(matcher.group(2)).isEqualTo("-100.0");
            assertThat(matcher.group(3)).isEqualTo("50.0");
            assertThat(matcher.group(4)).isEqualTo("100.0");
        }
    }
}
